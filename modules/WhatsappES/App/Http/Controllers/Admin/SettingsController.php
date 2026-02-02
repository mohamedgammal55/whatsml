<?php

namespace Modules\WhatsappES\App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Traits\Dotenv;
use App\Traits\Uploader;
use App\Helpers\PageHeader;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SettingsController extends Controller
{
    use Dotenv, Uploader;

    public function index()
    {
        PageHeader::set(trans('Whatsapp ES Settings'));
        
        Inertia::setRootView('layouts.user');
        
        $data = [
            'WHATSAPP_ES_FACEBOOK_CLIENT_ID' => config('whatsappes.facebook_client_id'),
            'WHATSAPP_ES_FACEBOOK_CLIENT_SECRET' => config('whatsappes.facebook_client_secret'),
            'WHATSAPP_ES_FACEBOOK_CONFIG_ID' => config('whatsappes.whatsapp_es_config_id'),
            'WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN' => config('whatsappes.webhook_verify_token'),
        ];
        return Inertia::render('Admin/Setting', $data);
    }


    public function store(Request $request)
    {
        $this->updateEnv([
            'WHATSAPP_ES_FACEBOOK_CLIENT_ID' => $request->get('WHATSAPP_ES_FACEBOOK_CLIENT_ID'),
            'WHATSAPP_ES_FACEBOOK_CLIENT_SECRET' => $request->get('WHATSAPP_ES_FACEBOOK_CLIENT_SECRET'),
            'WHATSAPP_ES_FACEBOOK_CONFIG_ID' => $request->get('WHATSAPP_ES_FACEBOOK_CONFIG_ID'),
            'WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN' => $request->get('WHATSAPP_ES_WEBHOOK_VERIFY_TOKEN'),
        ]);

        return back()->with('success', __('Settings updated successfully'));
    }
}
