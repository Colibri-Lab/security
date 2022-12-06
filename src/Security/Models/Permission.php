<?php

namespace App\Modules\Security\Models;
use Colibri\Data\Storages\Fields\ObjectField;

/**
 * @property string $path
 * @property string $value
 */
class Permission extends ObjectField
{

    public const JsonSchema = [
        'type' => 'object',
        'patternProperties' => [
            '.*' => [
                'type' => 'string'
            ]
        ]
    ];

    const Allow = 'allow';
    const Deny = 'deny';

    public function Check($command): string|null
    {
        $permission = str_replace('*', '.*', str_replace('.', '\.', $this->path));
        if (preg_match('/' . $permission . '$/im', $command, $matches) > 0) {
            return $this->value;
        }
        return null;
    }

}