<?php

namespace App\Http\Requests\Organizations;

use App\Enums\OrganizationRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'role' => [
                'required',
                Rule::enum(OrganizationRole::class)->only([
                    OrganizationRole::Administrator,
                    OrganizationRole::Member,
                ]),
            ],
        ];
    }
}
