<?php

namespace App\Modules\Security\Models;

use Colibri\Data\DataAccessPoint;
use Colibri\Data\SqlClient\IDataReader;
use Colibri\Data\Storages\Storages;
use Colibri\Data\Storages\Storage;
use Colibri\Data\Storages\Models\DataTable as BaseModelDataTable;
use App\Modules\Security\Models\UserRole;
use Colibri\Utils\Logs\Logger;

/**
 * Таблица, представление данных в хранилище Роль пользователя
 * @author <author name and email>
 * @package App\Modules\Security\Models
 * 
 * @method UserRole[] getIterator()
 * @method UserRole _createDataRowObject()
 * @method UserRole _read()
 * 
 */
class UserRoles extends BaseModelDataTable
{

    /**
     * Конструктор
     * @param DataAccessPoint $point точка доступа
     * @param IDataReader|null $reader ридер
     * @param string|\Closure $returnAs возвращать в виде класса
     * @param Storage|null $storage хранилище
     * @return void 
     */
    public function __construct(DataAccessPoint $point, IDataReader $reader = null, string $returnAs = 'UserRole', Storage|null $storage = null)
    {
        parent::__construct($point, $reader, $returnAs, $storage);
    }


    /**
     * Создание модели по названию хранилища
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @param string $filter строка фильтрации
     * @param string $order сортировка
     * @param array $params параметры к запросу
     * @return UserRoles
     */
    static function LoadByFilter(int $page = -1, int $pagesize = 20, string $filter = null, string $order = null, array $params = [], bool $calculateAffected = true): UserRoles
    {
        $storage = Storages::Create()->Load('roles');
        $additionalParams = ['page' => $page, 'pagesize' => $pagesize, 'params' => $params];
        if(!$calculateAffected) {
            $additionalParams['type'] = DataAccessPoint::QueryTypeBigData;
        }
        return self::LoadByQuery(
            $storage,
            'select * from ' . $storage->name . 
                ($filter ? ' where ' . $filter : '') . 
                ($order ? ' order by ' . $order : ''), 
            $additionalParams
        );
    }

    /**
     * Загружает без фильтра
     * @param int $page страница
     * @param int $pagesize размер страницы
     * @return UserRoles 
     */
    static function LoadAll(int $page = -1, int $pagesize = 20): UserRoles
    {
        return self::LoadByFilter($page, $pagesize, null, null);
    }

    /**
     * Возвращает модель по ID
     * @param int $id ID строки
     * @return UserRole|null
     */
    static function LoadById(int $id): UserRole
    {
        $table = self::LoadByFilter(1, 1, '{id}=[[id:integer]]', null, ['id' => $id]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Возвращает модель наименоваю
     * @param string $name наименование
     * @return UserRole|null
     */
    static function LoadByName(string $name): UserRole
    {
        $table = self::LoadByFilter(1, 1, '{name}=[[name:string]]', null, ['name' => $name]);
        return $table->Count() > 0 ? $table->First() : null;
    }

    /**
     * Создание модели по названию хранилища
     * @return UserRole
     */
    static function LoadEmpty(): UserRole
    {
        $reports = self::LoadByFilter(-1, 20, 'false');
        return $reports->CreateEmptyRow();
    }

    static function DataMigrate(?Logger $logger = null): bool
    {

        $defaultRoles = [
            'Administrator' => '[{"path": "*", "value": "allow"}]',
            'Readonly' => '[{"path": "*", "value": "deny"}, {"path": "security.login", "value": "allow"}]',
            'Disabled' => '[{"path": "*", "value": "deny"}]',
            'Manager' => '[{"path": "login", "value": "allow"}, {"path": "app.security.profile.*", "value": "allow"}, {"path": "*access", "value": "allow"}, {"path": "*.data.*", "value": "allow"}, {"path": "*", "value": "deny"}]',
        ];

        $logger->info('Migrating data of storage: roles');

        foreach($defaultRoles as $roleName => $rolePermissions) {
            $role = UserRoles::LoadByName($roleName);
            if(!$role) {
                $role = UserRoles::LoadEmpty();
                $role->name = $roleName;
                $role->permissions = $rolePermissions;
                $role->Save();
            }    
        }

        return true;

    }

}