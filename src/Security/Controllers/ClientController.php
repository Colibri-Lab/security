<?php


namespace App\Modules\Security\Controllers;

use Colibri\Exceptions\ApplicationErrorException;
use Colibri\Exceptions\BadRequestException;
use Colibri\Exceptions\PermissionDeniedException;
use Colibri\Exceptions\ValidationException;
use Colibri\Rpc\Controller as RpcController;
use App\Modules\Security\Module;
use Colibri\Web\RequestCollection;
use Colibri\Web\PayloadCopy;
use Colibri\Data\Storages\Storages;
use App\Modules\Security\Models\Member;
use App\Modules\Security\Models\Users;
use App\Modules\Security\Models\UserRoles;
use Colibri\App;
use InvalidArgumentException;

class ClientController extends RpcController
{

    public function Settings(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {
        $isLogged = Module::$instance->IsLogged();
        $member = null;
        if ($isLogged) {
            $member = Module::$instance->current->ToArray(true);
        }
        $permissions = App::$moduleManager->GetPermissions();
        return $this->Finish(200, 'ok', ['settings' => ['logged' => $isLogged, 'permissions' => $permissions], 'user' => $member]);
    }

    public function Roles(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {

        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::$instance->current->IsCommandAllowed('security.administrate.roles')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $roles = UserRoles::LoadAll();

        return $this->Finish(200, 'ok', $roles->ToArray(true));
    }

    public function Users(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {
        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::$instance->current->IsCommandAllowed('security.administrate.users')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $users = Users::LoadAll();

        return $this->Finish(200, 'ok', $users->ToArray(true));
    }

    public function SaveUser(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {

        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $id = $post->{'id'};
        if (
            (!$id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.add')) ||
            (Module::$instance->current->id != $id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.save'))
        ) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $password = $post->{'password'};
        $login = $post->{'login'};
        $role = $post->{'role'};
        $fio = $post->{'fio'};
        $phone = $post->{'phone'};
        $avatar = $post->{'avatar'};

        if ($id) {
            $user = Users::LoadById($id);
        } else {
            $user = Users::LoadEmpty();
        }

        $accessPoint = $user->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $user->login = $login;
            if ($password) {
                $user->password = $password;
            }

            $user->role = UserRoles::LoadById($role['id'] ?? $role);
            $user->fio = $fio;
            $user->phone = $phone;
            $user->permissions = $post->{'permissions'} ?: '[]';
            $user->avatar = $avatar;

            if (($res = $user->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $user->ToArray(true));
    }


    public function SaveRole(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {

        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $id = $post->{'id'};
        if (!$id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.add')) {
            throw new PermissionDeniedException('Permission denied', 403);
        } elseif (!Module::$instance->current->IsCommandAllowed('security.administrate.users.save')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if ($id) {
            $role = UserRoles::LoadById($id);
        } else {
            $role = UserRoles::LoadEmpty();
        }

        $accessPoint = $role->Storage()->accessPoint;
        $accessPoint->Begin();

        try {

            $role->name = $post->{'name'};
            $role->permissions = $post->{'permissions'};

            if (($res = $role->Save(true)) !== true) {
                throw new InvalidArgumentException($res->error, 400);
            }

        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            throw new BadRequestException($e->getMessage(), 400, $e);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            throw new ApplicationErrorException($e->getMessage(), 500, $e);
        }

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $role->ToArray(true));

    }

    public function RemoveRole(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {
        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::$instance->current->IsCommandAllowed('security.administrate.roles.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }


        $id = $post->{'id'};
        $role = UserRoles::LoadById($id);
        $readonlyRole = UserRoles::LoadByName('Readonly');

        $users = $role->Users();
        foreach ($users as $user) {
            $user->role = $readonlyRole;
            $user->Save();
        }

        $role->Delete();

        return $this->Finish(200, 'ok');

    }

    public function RemoveUser(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {
        if (!Module::$instance->current) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        if (!Module::$instance->current->IsCommandAllowed('security.administrate.roles.remove')) {
            throw new PermissionDeniedException('Permission denied', 403);
        }

        $id = $post->{'id'};
        if (!$id || Module::$instance->current->id == $id) {
            throw new BadRequestException('Bad request', 400);
        }

        $user = Users::LoadById($id);
        $user->Delete();

        return $this->Finish(200, 'ok');

    }

    public function Login(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {

        if (!$post->{'login'} || !$post->{'password'}) {
            return $this->Finish(400, 'Bad request', []);
        }

        $result = Module::$instance->Login($post->{'login'}, $post->{'password'});
        if ($result) {
            return $this->Finish(200, 'Logged');
        } else {
            return $this->Finish(403, 'Access denied');
        }

    }

    public function Logout(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload): object
    {
        Module::$instance->current->Logout();
        Module::$instance->ClearSession();
        return $this->Finish(200, 'Unlogged');
    }


    /**
     * Handles ping request
     * @param RequestCollection $get данные GET
     * @param RequestCollection $post данные POST
     * @param mixed $payload данные payload обьекта переданного через POST/PUT
     * @return object
     */
    public function Ping(RequestCollection $get, RequestCollection $post, ? PayloadCopy $payload = null): object
    {

        $result = [];
        $message = 'Result message';
        $code = 200;
            
        return $this->Finish(
            $code,
            $message,
            $result,
            'utf-8'
        );

    }


    
}