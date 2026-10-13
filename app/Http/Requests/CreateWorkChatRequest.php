<?php

namespace App\Http\Requests;

use App\Models\Conversation;
use Illuminate\Foundation\Http\FormRequest;

class CreateWorkChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Conversation::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255', 'regex:/\S/u'],
            'idempotency_key' => ['required', 'uuid'],
        ];
    }
}
