<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ExchangeExtensionHandoffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'secret' => [
                'required',
                'string',
                'size:43',
                'regex:/^[A-Za-z0-9_-]+$/',
            ],
            'code_verifier' => [
                'required',
                'string',
                'between:43,128',
                'regex:/^[A-Za-z0-9._~-]+$/',
            ],
        ];
    }
}
