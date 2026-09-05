<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StartExtensionHandoffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'code_challenge' => [
                'required',
                'string',
                'size:43',
                'regex:/^[A-Za-z0-9_-]+$/',
            ],
        ];
    }
}
