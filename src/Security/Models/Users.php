<?php

namespace App\Modules\Security\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Security\Models\User;
use Colibri\Utils\Logs\Logger;

/**
 * Таблица, представление данных в хранилище Пользователи системы безопасности
 * @author <author name and email>
 * @package App\Modules\Security\Models
 *
 * @method User[] getIterator()
 * @method User _createDataRowObject()
 * @method User _read()
 * @method User offsetGet(mixed $offset)
 *
 */
class Users extends BaseModelDataTable
{
    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void
     */
    public function __construct(
        DataAccessPoint $point,
        IDataReader $reader = null,
        string $returnAs = 'User',
        Storage|null $storage = null
    ) {
        parent::__construct($point, $reader, $returnAs, $storage);
    }


    /**
     * Создание модели по названию хранилища
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @param string $filter строка фильтрации
     * @param string $order сортировка
     * @param array $params параметры к запросу
     * @return Users
     */
    public static function LoadByFilter(
        int $page = -1,
        int $pagesize = 20,
        string $filter = null,
        string $order = null,
        array $params = [],
        bool $calculateAffected = true
    ): ?Users {
        $storage = Storages::Create()->Load('users');
        return parent::_loadByFilter($storage, $page, $pagesize, $filter, $order, $params, $calculateAffected);

    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return Users
     */
    public static function LoadAll(int $page = -1, int $pagesize = 20, bool $calculateAffected = false): ?Users
    {
        return self::LoadByFilter($page, $pagesize, null, null, [], $calculateAffected);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return User|null
     */
    public static function LoadById(int $id): User|null
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id], false);
        return $table && $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель по login
     * @param string $login Логин строки
     * @return User|null
     */
    public static function LoadByLogin(string $login): User|null
    {
        $table = self::LoadByFilter(1, 1, '{login}=[[login:string]]', null, ['login' => $login]);
        return $table && $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает список пользователей по роли
     * @param UserRole|int $role роль
     * @return Users
     */
    public static function LoadByRole(UserRole|int $role): ?Users
    {
        if (!is_numeric($role)) {
            $role = $role->id;
        }
        return self::LoadByFilter(1, 1, '{role}=[[role:string]]', null, ['role' => $role]);
    }


    /**
     * Создание модели по названию хранилища
     * @return User
     */
    public static function LoadEmpty(): ?User
    {
        $table = self::LoadByFilter(-1, 20, 'false');
        return $table->CreateEmptyRow();
    }

    public static function DataMigrate(?Logger $logger = null): bool
    {

        $logger->info('Migrating data of storage: users');
        $adminUser = Users::LoadByLogin('admin');
        if ($adminUser) {
            return true;
        }

        $role = UserRoles::LoadByName('Administrator');
        if (!$role) {
            $role = UserRoles::LoadEmpty();
            $role->name = 'Administrator';
            $role->permissions = '[{"path": "*", "value": "allow"}]';
            $role->Save();
        }

        $adminUser = Users::LoadEmpty();
        $adminUser->login = 'admin';
        $adminUser->password = '12345678';
        $adminUser->fio = ["lastName" => "DefaultAdmin", "firstName" => "User", "patronymic" => ""];
        $adminUser->avatar = '{}';
        $adminUser->permissions = '[]';
        $adminUser->settings = '{"logged": 0}';
        $adminUser->role = $role;
        return $adminUser->Save();

    }

}
