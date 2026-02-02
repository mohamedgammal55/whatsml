<?php

namespace Modules\WhatsappES\App\Http\Controllers;

use Inertia\Inertia;
use App\Helpers\Toastr;
use App\Models\Platform;
use App\Helpers\PageHeader;
use Illuminate\Http\Request;
use App\Services\GraphApiService;
use App\Http\Controllers\Controller;

class PlatformController extends Controller
{
    public function create()
    {
        abort_unless(activeWorkspaceOwnerId() == auth()->id(), 403, 'You do not have permission to perform this action in this workspace.');
        validateWorkspacePlan('devices');

        PageHeader::set()->title('Signup Whatsapp')
            ->addLink(
                'Back',
                route('user.whatsapp.platforms.index'),
                'bx:arrow-back',
                'href',
            );

        return Inertia::render('Signup', [
            'facebook_client_id' => config('whatsappes.facebook_client_id'),
            'whatsapp_es_config_id' => config('whatsappes.whatsapp_es_config_id'),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless(activeWorkspaceOwnerId() == auth()->id(), 403, __('You do not have permission to perform this action in this workspace.'));
        validateWorkspacePlan('devices');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone_number_id' => 'required|numeric',
            'waba_id' => 'required|numeric',
            'business_id' => 'required|numeric',
            'auth_code' => 'required|string'
        ]);

        // Step 1: Exchange the token code for a business token
        $accessTokenRes = GraphApiService::facebook()->client()->get('/oauth/access_token', [
            'client_id' => config('whatsappes.facebook_client_id'),
            'client_secret' => config('whatsappes.facebook_client_secret'),
            'code' => $validated['auth_code'],
        ]);
        $accessToken = $accessTokenRes->json('access_token', null);

        if ($accessTokenRes->failed() || $accessToken === null) {
            return back()->with(
                'danger',
                $accessTokenRes->json('error.message', 'Error occurred while getting access token')
            );
        }

        $platform = Platform::create([
            'module' => 'whatsapp',
            'owner_id' => activeWorkspaceOwnerId(),

            'name' => $validated['name'] ?? 'WhatsApp',
            'uuid' => $validated['phone_number_id'],

            'access_token' => $accessToken,
            'access_token_expire_at' => now()->addDay(),

            'refresh_token' => null,
            'refresh_token_expire_at' => null,
            'meta' => Platform::defaultMeta([
                'phone_number_id' => $validated['phone_number_id'],
                'waba_id' => $validated['waba_id'],
                'business_account_id' => $validated['business_id'],
                'type' => 'whatsapp_es',
            ]),
        ]);

        // Step 2: Subscribe to webhooks on the customer's WABA
        $subscribedAppsRes = GraphApiService::facebook()->client($accessToken)->post("{$validated['waba_id']}/subscribed_apps");

        if ($subscribedAppsRes->successful()) {
            $newMeta = [
                ...$platform->meta,
                'webhook_url' => $subscribedAppsRes->json('webhook_url'),
                'webhook_connected' => true,
            ];

            $platform->updateQuietly(['meta' => $newMeta]);
        }

        if ($subscribedAppsRes->failed()) {
            Toastr::danger($subscribedAppsRes->json('error.message', 'Error occurred while subscribing to webhooks'));
        }

        Toastr::success('Device created successfully.');

        return Inertia::location(route('user.whatsapp.platforms.index'));
    }
}
