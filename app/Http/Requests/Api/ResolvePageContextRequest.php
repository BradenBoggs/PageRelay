<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ResolvePageContextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'max:4096'],
            'title' => ['required', 'string', 'max:255'],
            'favicon_url' => ['nullable', 'string', 'max:4096'],
        ];
    }
}
