<?php

namespace App\Modules\Security\Models;

use Colibri\Data\SqlClient\QueryInfo;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Encryption\Crypt;

# region Uses:
use App\Modules\Manage\Models\Fields\RemoteFileField;
use App\Modules\Security\Models\Fields\Users\FioObjectField;
use App\Modules\Security\Models\Fields\Users\SettingsObjectField;
use App\Modules\Security\Models\Permissions;
use App\Modules\Security\Models\UserRole;
use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Fields\ObjectField;
# endregion Uses;


/**
 * Представление строки в таблице в хранилище Пользователи системы безопасности
 * @author <author name and email>
 * @package App\Modules\Security\Models
 * 
 * region Properties:
 * @property int $id ID строки
 * @property DateTimeField $datecreated Дата создания строки
 * @property DateTimeField $datemodified Дата последнего обновления строки
 * @property string $login Логин пользователя
 * @property string $password Пароль
 * @property FioObjectField|null $fio ФИО пользователя
 * @property string|null $phone Телефон
 * @property RemoteFileField|null $avatar Аватар пользователя
 * @property UserRole $role Роль
 * @property Permissions|null $permissions Права доступа
 * @property SettingsObjectField|null $settings 
 * endregion Properties;
 */
class User extends BaseModelDataRow
{

    public const JsonSchema = [
        'type' => 'object',
        'required' => [
            'id',
            'datecreated',
            'datemodified',
            # region SchemaRequired:
			'password',
			# endregion SchemaRequired;
        ],
        'properties' => [
            'id' => ['type' => 'integer'],
            'datecreated' => ['type' => 'string', 'format' => 'db-date-time'],
            'datemodified' => ['type' => 'string', 'format' => 'db-date-time'],
            # region SchemaProperties:
			'login' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 255, ] ] ],
			'password' => ['type' => 'string', 'maxLength' => 255, ],
			'fio' => [  'oneOf' => [ FioObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			'phone' => [ 'oneOf' => [ [ 'type' => 'null'], ['type' => 'string', 'maxLength' => 12, ] ] ],
			'avatar' => [ 'oneOf' => [ [ 'type' => 'null'], RemoteFileField::JsonSchema ] ],
			'role' => [ 'oneOf' => [ [ 'type' => 'null'], UserRole::JsonSchema ] ],
			'permissions' => [ 'oneOf' => [ [ 'type' => 'null'], Permissions::JsonSchema ] ],
			'settings' => [  'oneOf' => [ SettingsObjectField::JsonSchema, [ 'type' => 'null'] ] ],
			# endregion SchemaProperties;
        ]
    ];

    /**
     * Авторизация пользователя
     */
    public function Authorize(string $password): bool
    {

        if ($this->password == $password) {
            $this->settings->logged = true;
            $this->Save();
            return true;
        }

        return false;

    }

    public function Logout(): void
    {
        $this->settings->logged = false;
        $this->Save();
    }


    public function setPropertyPassword(string $value): void
    {
        $this->_data['users_password'] = Crypt::Encrypt($this->login, $value, Crypt::EncryptionAlgHex);
    }

    public function getPropertyPassword(): string
    {
        return Crypt::Decrypt($this->login, $this->_data['users_password'], Crypt::EncryptionAlgHex);
    }

    // public function setPropertyAvatar(string|array|object $value): void
    // {
    //     $this->_data['users_avatar'] = is_string($value) ? $value : json_encode($value);
    // }

    // public function getPropertyAvatar(): string
    // {
    //     return is_string($this->_data['users_avatar']) ? json_decode($this->_data['users_avatar']) : $this->_data['users_avatar'];
    // }

    public function ToArray(bool $noPrefix = false): array
    {
        $ar = parent::ToArray($noPrefix);
        unset($ar['password']);
        return $ar;
    }

    public function IsCommandAllowed(string $command): bool
    {

        $rolePermissions = $this->role->permissions;
        $userPermissions = $this->permissions;

        $rolePermissions->Append($userPermissions);

        $rolePermissions->Sort('path', SORT_DESC);

        foreach ($rolePermissions as $permission) {
            /** @var Permission $permission */
            if ($result = $permission->Check($command)) {
                return $result === Permission::Allow;
            }
        }


        return false;
    }

    public function Save(bool $performValidationBeforeSave = false): bool|QueryInfo
    {
        return $this->table->SaveRow($this);
    }

}