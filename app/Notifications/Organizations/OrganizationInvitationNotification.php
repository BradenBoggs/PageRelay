<?php

namespace App\Notifications\Organizations;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public OrganizationInvitation $invitation)
    {
        //
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $organizationName = $this->invitation->organization->name;
        $inviterName = $this->invitation->invited_by === null
            ? __('A SideWire administrator')
            : $this->invitation->inviter->name;

        return (new MailMessage)
            ->subject(__("You've been invited to join :organization", [
                'organization' => $organizationName,
            ]))
            ->line(__(':inviter invited you to join :organization on SideWire.', [
                'inviter' => $inviterName,
                'organization' => $organizationName,
            ]))
            ->action(
                __('Create your SideWire account'),
                route('register', ['invitation' => $this->invitation->code]),
            );
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'organization_id' => $this->invitation->organization_id,
            'organization_name' => $this->invitation->organization->name,
            'role' => $this->invitation->role->value,
        ];
    }
}
