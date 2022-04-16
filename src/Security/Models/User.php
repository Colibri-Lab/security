<?php

namespace App\Modules\Security\Models;

use Colibri\Data\Storages\Fields\DateTimeField;
use Colibri\Data\Storages\Models\DataRow as BaseModelDataRow;
use Colibri\Data\Storages\Fields\ObjectField;
use App\Modules\Manage\Models\Fields\RemoteFileField;
use App\Modules\Security\Models\UserRole;
use Colibri\Encryption\Crypt;
use Colibri\Web\RequestedFile;
use Colibri\IO\FileSystem\File;
use Colibri\Data\Storages\Fields\FileField;

/**
 * Представление строки в таблице в хранилище Пользователи системы безопасности
 * @author <author name and email>
 * @package App\Modules\Security\Models
 * 
 * region Properties:
 * @property-read int $id ID строки
 * @property-read DateTimeField $datecreated Дата создания строки
 * @property-read DateTimeField $datemodified Дата последнего обновления строки
 * @property string|null $login Логин пользователя
 * @property string $password Пароль
 * @property ObjectField|null $fio ФИО пользователя
 * @property string|null $phone Телефон
 * @property RemoteFileField|null $avatar Аватар пользователя
 * @property UserRole|null $role Роль
 * @property Permissions|null $permissions Права доступа
 * @property ObjectField|null $settings 
 * endregion Properties;
 */
class User extends BaseModelDataRow
{

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

    public function Save(): bool 
    {
        return $this->table->SaveRow($this);
    }

}