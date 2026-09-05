<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class LinkPageContextRequest extends FormRequest
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
            'expected_association_version' => ['required', 'integer', 'min:0'],
        ];
    }
}
