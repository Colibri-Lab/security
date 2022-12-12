<?php


namespace App\Modules\Security\Controllers;

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

    public function Settings(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        $isLogged = Module::$instance->IsLogged();
        $member = null;
        if ($isLogged) {
            $member = Module::$instance->current->ToArray(true);
        }
        $permissions = App::$moduleManager->GetPermissions();
        return $this->Finish(200, 'ok', ['settings' => ['logged' => $isLogged, 'permissions' => $permissions], 'user' => $member]);
    }

    public function Roles(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.roles')) {
            return $this->Finish(403, 'Permission denied');
        }

        $roles = UserRoles::LoadAll();

        return $this->Finish(200, 'ok', $roles->ToArray(true));
    }

    public function Users(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.users')) {
            return $this->Finish(403, 'Permission denied');
        }

        $users = Users::LoadAll();

        return $this->Finish(200, 'ok', $users->ToArray(true));
    }

    public function SaveUser(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if ( 
            (!$id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.add')) ||
            (Module::$instance->current->id != $id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.save')) 
        ) {
            return $this->Finish(403, 'Permission denied');
        }

        $password = $post->password;
        $login = $post->login;
        $role = $post->role;
        $fio = $post->fio;
        $phone = $post->phone;
        $avatar = $post->avatar;

        if($id) {
            $user = Users::LoadById($id);
        }
        else {
            $user = Users::LoadEmpty();
        }

        $accessPoint = $user->Storage()->accessPoint;
        $accessPoint->Begin();

        try {
                   
            $user->login = $login;
            if ($password) {
                $user->password = $password;
            }

            $user->role = UserRoles::LoadById($role);
            $user->fio = $fio;
            $user->phone = $phone;
            $user->permissions = $post->permissions ?: '[]';
            $user->avatar = $avatar;
    
            if ( ($res = $user->Save(true)) !== true ) {
                throw new InvalidArgumentException($res->error, 400); 
            }
    
        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        } 

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $user->ToArray(true));
    }


    public function SaveRole(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if(!$id && !Module::$instance->current->IsCommandAllowed('security.administrate.users.add')) {
            return $this->Finish(403, 'Permission denied');
        }
        else if(!Module::$instance->current->IsCommandAllowed('security.administrate.users.save')) {
            return $this->Finish(403, 'Permission denied');
        }

        if($id) {
            $role = UserRoles::LoadById($id);
        }
        else {
            $role = UserRoles::LoadEmpty();
        }
        
        $accessPoint = $role->Storage()->accessPoint;
        $accessPoint->Begin();

        try {
                   
            $role->name = $post->name;
            $role->permissions = $post->permissions;
    
            if ( ($res = $role->Save(true)) !== true ) {
                throw new InvalidArgumentException($res->error, 400); 
            }
    
        } catch (InvalidArgumentException $e) {
            $accessPoint->Rollback();
            return $this->Finish(400, 'Bad request', ['message' => $e->getMessage(), 'code' => 400]);
        } catch (ValidationException $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application validation error', ['message' => $e->getMessage(), 'code' => 400, 'data' => $e->getExceptionDataAsArray()]);
        } catch (\Throwable $e) {
            $accessPoint->Rollback();
            return $this->Finish(500, 'Application error', ['message' => $e->getMessage(), 'code' => 500]);
        } 

        $accessPoint->Commit();

        return $this->Finish(200, 'ok', $role->ToArray(true));

    }

    public function RemoveRole(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.roles.remove')) {
            return $this->Finish(403, 'Permission denied');
        }


        $id = $post->id;
        $role = UserRoles::LoadById($id);
        $readonlyRole = UserRoles::LoadByName('Readonly');

        $users = $role->Users();
        foreach($users as $user) {
            $user->role = $readonlyRole;
            $user->Save();
        }

        $role->Delete();

        return $this->Finish(200, 'ok');

    }

    public function RemoveUser(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        if(!Module::$instance->current) {
            return $this->Finish(403, 'Permission denied');
        }

        if(!Module::$instance->current->IsCommandAllowed('security.administrate.roles.remove')) {
            return $this->Finish(403, 'Permission denied');
        }

        $id = $post->id;
        if(!$id || Module::$instance->current->id == $id) {
            return $this->Finish(400, 'Bad request');
        }

        $user = Users::LoadById($id);
        $user->Delete();

        return $this->Finish(200, 'ok');

    }

    public function Login(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {

        if (!$post->login || !$post->password) {
            return $this->Finish(400, 'Bad request', []);
        }

        $result = Module::$instance->Login($post->login, $post->password);
        if ($result) {
            return $this->Finish(200, 'Logged');
        }
        else {
            return $this->Finish(403, 'Access denied');
        }

    }

    public function Logout(RequestCollection $get, RequestCollection $post, ?PayloadCopy $payload): object
    {
        Module::$instance->current->Logout();
        Module::$instance->ClearSession();
        return $this->Finish(200, 'Unlogged');
    }


}
