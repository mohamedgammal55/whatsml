<?php

namespace Modules\Whatsapp\App\Http\Controllers;

use App\Models\Message;
use App\Traits\Uploader;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Modules\Whatsapp\App\Services\WhatsappClient;

class MessageController extends Controller
{
    use Uploader;

    public function loadAttachment($wamid)
    {
        $message = Message::where('uuid', $wamid)->firstOrFail();

        validateUserPlan('storage', false, $message->user_id);

        $meta = $message->meta ?? [];
        if (data_get($meta, 'attachment_loaded'))
            return $meta;

        $ext = $this->getExtension($message->getBody('mime_type'));

        throw_if(!$ext, "Unsupported file type: {$message->getBody('mime_type')}", 422);

        $platform = $message->platform;
        $accessToken = $platform->access_token;
        $phoneNumberId = $platform->uuid;
        $waClient = WhatsappClient::make($accessToken, $phoneNumberId);
        $mediaId = $message->getBody('id');
        $mediaInfoRes = $waClient->getMediaInfo($mediaId)->throw();
        $fileUrl = $mediaInfoRes->json('url');
        $fileRes = $waClient->getMedia($fileUrl)->throw();
        $meta['media_url'] = $this->uploadBodyContent($fileRes->getBody(), $ext);
        $meta['attachment_loaded'] = true;
        unset($meta['unsupported']);
        $message->update(['meta' => $meta]);
        return $meta;
    }
}
