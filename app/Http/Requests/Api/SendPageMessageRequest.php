<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SendPageMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:10000', 'regex:/\S/u'],
            'idempotency_key' => ['required', 'uuid'],
            'expected_association_version' => ['required', 'integer', 'min:0'],
        ];
    }
}
