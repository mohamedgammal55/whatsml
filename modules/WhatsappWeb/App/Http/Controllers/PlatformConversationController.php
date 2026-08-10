<?php

namespace Modules\WhatsappWeb\App\Http\Controllers;

use Inertia\Inertia;
use App\Helpers\PageHeader;
use App\Services\ChatService;
use Nwidart\Modules\Facades\Module;
use App\Http\Controllers\Controller;

class PlatformConversationController extends Controller
{
    public function index($platformUuid)
    {
        $platform = activeWorkspaceOwner()->platforms()->whatsappWeb()->where('uuid', $platformUuid)->firstOrFail();

        PageHeader::set()->title('Whatsapp Chats')
            ->buttons([
                [
                    'text' => 'Back',
                    'url' => route('user.whatsapp-web.platforms.index'),
                ],
            ]);
        $languages = json_decode(file_get_contents(base_path('database/json/languages.json')), true);
        $languages = array_values(array_map(function ($language) {
            return [
                'id' => $language['id'],
                'name' => $language['name'],
            ];
        }, $languages));

        $moduleFeatures = Module::find('WhatsappWeb')->get('features');
        $chatService = new ChatService('whatsapp-web');

        return Inertia::render('Chats/Index', [
            'platforms' => [$platform],
            'languages' => $languages,
            'api_base_url' => url('api/whatsapp-web/v1'),
            'wa_socket' => $this->socketConfig([$platform->uuid]),
            'chat_templates' => $chatService->templates(),
            'quick_replies' => $chatService->quickReplyTemplates(),
            'badges' => $chatService->badges(),
            'module_features' => $moduleFeatures
        ]);
    }

    /**
     * Build the realtime socket config for the frontend: the public socket URL
     * plus a short-lived HMAC token scoped to the given session UUIDs. The Node
     * server verifies this token, so only this user can subscribe, and only to
     * their own sessions.
     */
    private function socketConfig(array $sessions): array
    {
        $url = config('whatsapp-web.socket_url');
        $secret = config('whatsapp-web.socket_secret');
        if (empty($url) || empty($secret)) {
            return ['url' => '', 'token' => null];
        }

        $b64url = fn ($bin) => rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
        $payload = ['sessions' => array_values($sessions), 'exp' => time() + 60 * 60 * 6];
        $body = $b64url(json_encode($payload));
        $mac = $b64url(hash_hmac('sha256', $body, $secret, true));

        return ['url' => $url, 'token' => $body . '.' . $mac];
    }
}
