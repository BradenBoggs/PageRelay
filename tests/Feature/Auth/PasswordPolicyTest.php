<?php

namespace Tests\Feature\Auth;

use App\Concerns\PasswordValidationRules;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PasswordPolicyTest extends TestCase
{
    public static function environments(): array
    {
        return [['production'], ['local']];
    }

    #[DataProvider('environments')]
    public function test_password_minimum_is_eight_without_complexity_requirements(string $environment): void
    {
        $this->app['env'] = $environment;
        $policy = new class
        {
            use PasswordValidationRules;

            public function rules(): array
            {
                return $this->passwordRules();
            }
        };
        foreach (['aaaaaaaa', '12345678', 'a longer simple password'] as $password) {
            $this->assertTrue(Validator::make(['password' => $password, 'password_confirmation' => $password], ['password' => $policy->rules()])->passes());
        }
        $this->assertFalse(Validator::make(['password' => '1234567', 'password_confirmation' => '1234567'], ['password' => $policy->rules()])->passes());
        $this->assertFalse(Validator::make(['password' => '12345678', 'password_confirmation' => 'different'], ['password' => $policy->rules()])->passes());
    }
}
