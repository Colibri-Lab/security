<?php

namespace App\Modules\Security\Models\Fields\Users;

use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:

# endregion Uses;

/**
 * Представление поля в таблице в хранилище ФИО пользователя
 * @author <author name and email>
 * @package App\Modules\Security\Models\Fields\Users\Fields
 * 
 * region Properties:
 * @property string|null $firstName Имя
 * @property string|null $lastName Фамилия
 * @property string|null $patronymic Отчество
 * endregion Properties;
 */
class FioObjectField extends ObjectField
{
    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            # region SchemaRequired:

			# endregion SchemaRequired;
        ],
        'properties' => [
            # region SchemaProperties:
			'firstName' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 50, ] ] ],
			'lastName' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 50, ] ] ],
			'patronymic' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 50, ] ] ],
			# endregion SchemaProperties;
        ]
    ];
}
