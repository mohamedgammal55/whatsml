<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Http\Response;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // هذا السطر يلتقط أي 500 ويعرض رسالة بدون view
        $this->renderable(function (Throwable $e, $request) {
            if ($this->isHttpException($e) && $e->getStatusCode() === 500) {
                // ترجع JSON
                return response()->json([
                    'error' => 'Internal Server Error',
                    'message' => $e->getMessage() // ممكن تحذفه لو مش عايز التفاصيل
                ], 500);

                // أو لو تحب صفحة HTML بسيطة بدل JSON:
                /*
                return response('<h1>500 - Internal Server Error</h1><p>Something went wrong.</p>', 500);
                */
            }
        });
    }
}
