<?php

namespace App\Modules\Security\Models\Fields\Users;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:

# endregion Uses;

/**
 * Представление поля в таблице в хранилище 
 * @author <author name and email>
 * @package App\Modules\Security\Models\Fields\Users\Fields
 * 
 * region Properties:
 * @property bool|null $logged 
 * endregion Properties;
 */
class SettingsObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

			# endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'logged' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => ['boolean','number'], 'enum' => [true, false, 0, 1],] ] ],
			# endregion SchemaProperties;
        ]
    ];
}
