<?php

namespace Modules\WhatsappWeb\App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Modules\WhatsappWeb\App\Models\WhatsappWebApp;
use Modules\WhatsappWeb\App\Services\WhatsAppWebService;
use Illuminate\Support\Facades\DB;

class AppController extends Controller
{

    public function sendMessage(Request $request, WhatsAppWebService $whatsAppWebService)
    {
        $request->validate([
            'app_key' => ['required', 'exists:whatsapp_web_apps,key'],
            'auth_key' => ['required', 'exists:users,authKey'],
            'to' => ['required', 'string'],
            'message' => ['nullable', 'string', 'max:1000'],
            'message_type' => ['nullable', 'string', 'in:text,image,video,audio,document,voice'],
            'media_url' => ['nullable', 'url'],
            'file' => ['nullable', 'file', 'max:10240'],
            'caption' => ['nullable', 'string', 'max:1000'],
        ]);

        $appUser = User::query()
            ->where(
                'authKey',
                $request->get('auth_key')
            )
            ->first();

        $app = WhatsappWebApp::query()
            ->where('user_id', $appUser?->id)
            ->where(
                'key',
                $request->get('app_key')
            )
            ->first();

        if (!$app || !$appUser) {
            return response()->json([
                'success' => false,
                'error' => 'Authentication failed'
            ], 401);
        }

        $platformUuid = $app->platform?->uuid;

        if (!$platformUuid) {
            return response()->json([
                'success' => false,
                'error' => 'Platform not found'
            ], 404);
        }

        $jid = $request->get('to') . '@s.whatsapp.net';
        $messageType = $request->get('message_type', 'text');

        $mediaUrl = $request->get('media_url');

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $directory = 'uploads/api/' . date('Y/m');
            $path = $file->store($directory, 'public');
            $mediaUrl = \Illuminate\Support\Facades\Storage::url($path);
        }

        $message = match ($messageType) {
            'text' => ['text' => $request->get('message')],
            'image' => [
                'image' => $mediaUrl,
                'caption' => $request->get('caption') ?? $request->get('message'),
            ],
            'video' => [
                'video' => $mediaUrl,
                'caption' => $request->get('caption') ?? $request->get('message'),
            ],
            'audio' => [
                'audio' => $mediaUrl,
            ],
            'voice' => [
                'voice' => $mediaUrl,
            ],
            'document' => [
                'document' => $mediaUrl,
                'caption' => $request->get('caption') ?? $request->get('message'),
            ],
            default => ['text' => $request->get('message')],
        };

        $trackingId = uniqid('msg_', true);
        $message['tracking_id'] = $trackingId;

        DB::beginTransaction();
        try {

            // For media messages, we use a 'Fire and Forget' approach to avoid timeouts
            // since Baileys might take a long time to return the final object even if sent.
            if ($messageType !== 'text') {
                $whatsAppWebService->apiClient()->async()->post("/{$platformUuid}/messages/send", $message);

                $app->logs()->create([
                    'owner_id' => $appUser->id,
                    'platform_id' => $app->platform_id,
                    'tracking_id' => $trackingId,
                    'to' => $request->get('to'),
                    'status_code' => 200,
                    'request' => [
                        'sessionId' => $platformUuid,
                        'jid' => $jid,
                        'message' => $message,
                        'async' => true
                    ],
                    'response' => ['message' => 'Message sending initiated']
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Message sending initiated',
                    'tracking_id' => $trackingId
                ]);
            }

            $res = $whatsAppWebService->sendMessage(
                $platformUuid,
                $jid,
                $message,
                $messageType
            )->throw();

            $app->logs()->create([
                'owner_id' => $appUser->id,
                'platform_id' => $app->platform_id,
                'tracking_id' => $trackingId,
                'to' => $request->get('to'),
                'status_code' => $res->status(),
                'request' => [
                    'sessionId' => $platformUuid,
                    'jid' => '',
                    'message' => $message
                ],
                'response' => $res->json()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $res->json(),
                'tracking_id' => $trackingId
            ]);
        } catch (\Exception $exception) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => $exception->getMessage()
            ], 500);
        }
    }
}
