<?php

namespace App\Modules\Security\Models;

use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\Storages\Fields\ObjectField;

# region Uses:
use App\Modules\Security\Models\Permissions;
use Colibri\Data\Storages\Fields\DateTimeField;
# endregion Uses;

/**
 * Представление строки в таблице в хранилище Роль пользователя
 * @author <author name and email>
 * @package App\Modules\Security\Models
 * 
 * region Properties:
 * @property int $id ID строки
 * @property DateTimeField $datecreated Дата создания строки
 * @property DateTimeField $datemodified Дата последнего обновления строки
 * @property string $name Наименование роли
 * @property Permissions|null $permissions Права доступа
 * endregion Properties;
 */
class UserRole extends BaseModelDataRow
{

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'name',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'name' => ['type' => 'string', 'maxLength' => 255, ],
			'permissions' => [ 'oneOf' => [ [ 'type' => 'null'], Permissions::JsonSchema ] ],
			# endregion SchemaProperties;
        ]
    ];

    public function Users(): Users
    {
        return Users::LoadByRole($this);
    }

}