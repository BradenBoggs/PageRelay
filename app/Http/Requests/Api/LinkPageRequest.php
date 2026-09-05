<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class LinkPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'conversation_id' => ['required', 'uuid'],
            'page_url' => ['required', 'string', 'max:4096'],
            'page_title' => ['required', 'string', 'max:255', 'regex:/\S/u'],
            'favicon_url' => ['nullable', 'string', 'max:4096'],
        ];
    }
}
