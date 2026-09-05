<?php

namespace App\Providers;

use App\Contracts\Billing\UpdatesOrganizationSeatQuantity;
use App\Domain\Billing\CashierOrganizationSeatQuantityUpdater;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Observers\OrganizationMembershipObserver;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            UpdatesOrganizationSeatQuantity::class,
            CashierOrganizationSeatQuantityUpdater::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Organization::class);
        OrganizationMembership::observe(OrganizationMembershipObserver::class);
        RateLimiter::for('extension-api', fn (Request $request): Limit => Limit::perMinute(120)
            ->by((string) $request->user()->id));
        RateLimiter::for('extension-handoff', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->ip()));

        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
