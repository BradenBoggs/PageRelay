<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePageLinkRequest extends FormRequest
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
            'conversation_id' => ['nullable', 'uuid'],
            'chat_name' => ['required_without:conversation_id', 'nullable', 'string', 'max:255', 'regex:/\S/u'],
            'expected_context_id' => ['nullable', 'uuid'],
            'expected_association_version' => ['nullable', 'integer', 'min:0'],
            'matching' => ['required', 'array:mode,path_depth,query_keys,confirm_broad'],
            'matching.mode' => ['required', Rule::in(['exact', 'prefix'])],
            'matching.path_depth' => ['sometimes', 'integer', 'min:0', 'max:256'],
            'matching.query_keys' => ['sometimes', 'array', 'max:64'],
            'matching.query_keys.*' => ['string', 'max:255', 'distinct:strict'],
            'matching.confirm_broad' => ['sometimes', 'boolean'],
        ];
    }
}
