<?php

namespace App\Enums;

enum ConversationType: string
{
    case Page = 'page';
    case Organization = 'organization';
    case Direct = 'direct';
}
