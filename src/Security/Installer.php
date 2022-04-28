<?php

namespace App\Modules\Security;
use ReflectionClass;

class Installer
{

    private static function _copyOrSymlink($mode, $pathFrom, $pathTo, $fileFrom, $fileTo): void 
    {
        print_r('Копируем '.$mode.' '.$pathFrom.' '.$pathTo.' '.$fileFrom.' '.$fileTo."\n");
        if(!file_exists($pathFrom.$fileFrom)) {
            print_r('Файл '.$pathFrom.$fileFrom.' не существует'."\n");
            return;
        }

        if(file_exists($pathTo.$fileTo)) {
            print_r('Файл '.$pathTo.$fileTo.' существует'."\n");
            return;
        }

        if($mode === 'local') {
            shell_exec('ln -s '.realpath($pathFrom.$fileFrom).' '.$pathTo.($fileTo != $fileFrom ? $fileTo : ''));
        }
        else {
            shell_exec('cp -R '.realpath($pathFrom.$fileFrom).' '.$pathTo.$fileTo);
        }

        // если это исполняемый скрипт
        if(strstr($pathTo.$fileTo, '/bin/') !== false) {
            chmod($pathTo.$fileTo, 0777);
        }
    }

    /**
     * 
     * @param PackageEvent $event 
     * @return void 
     */
    public static function PostPackageInstall($event)
    {

        print_r('Установка и настройка модуля Авторизация' . "\n");

        $vendorDir = $event->getComposer()->getConfig()->get('vendor-dir') . '/';
        $configDir = './config/';

        if (!file_exists($configDir . 'app.yaml')) {
            print_r('Не найден файл конфигурации app.yaml' . "\n");
            return;
        }

        $mode = 'dev';
        $appYamlContent = file_get_contents($configDir . 'app.yaml');
        if (preg_match('/mode: (\w+)/', $appYamlContent, $matches) >= 0) {
            $mode = $matches[1];
        }

        $operation = $event->getOperation();
        $installedPackage = $operation->getPackage();
        $targetDir = $installedPackage->getName();
        $path = $vendorDir . $targetDir;
        $configPath = $path . '/src/Security/config-template/';

        // копируем конфиг
        print_r('Копируем файл конфигурации' . "\n");
        if (file_exists($configDir.'security.yaml')) {
            print_r('Файл конфигурации найден, пропускаем настройку' . "\n");
            return;
        }
        self::_copyOrSymlink($mode, $configPath, $configDir, 'module-' . $mode . '.yaml', 'security.yaml');


        print_r('Копируем файл хранилищ' . "\n");
        if (file_exists($configDir . 'security-storages.yaml')) {
            print_r('Файл конфигурации найден, пропускаем настройку' . "\n");
            return;
        }
        self::_copyOrSymlink($mode, $configPath, $configDir, 'security-storages.yaml', 'security-storages.yaml');

        // нужно прописать в модули
        $modulesTargetPath = $configDir . 'modules.yaml';
        $modulesConfigContent = file_get_contents($modulesTargetPath);
        if (strstr($modulesConfigContent, '- name: Security') !== false) {
            print_r('Модуль сконфигурирован, пропускаем' . "\n");
            return;
        }

        $modulesConfigContent = str_replace('entries:', 'entries:
  - name: Security
    entry: \Security\Module
    enabled: true
    desc: Система безопасности
    visible: true
    for:
      - manage
    config: include(/config/security.yaml)', $modulesConfigContent);
        file_put_contents($modulesTargetPath, $modulesConfigContent);

        print_r('Установка скриптов' . "\n");
        $scriptsPath = $path . '/src/Security/bin/';
        $binDir = './bin/';

        self::_copyOrSymlink($mode, $scriptsPath, $binDir, 'security-migrate.sh', 'security-migrate.sh');
        self::_copyOrSymlink($mode, $scriptsPath, $binDir, 'security-models-generate.sh', 'security-models-generate.sh');

        print_r('Копирование изображений' . "\n");

        $sourcePath = $path . '/src/Security/web/res/img/';
        $targetDir = './web/res/img/';

        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'security-arrow.svg', 'security-arrow.svg');
        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'security-logo-only.svg', 'security-logo-only.svg');
        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'security-icon-cart-white.svg', 'security-icon-cart-white.svg');
        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'security-logo.svg', 'security-logo.svg');
        self::_copyOrSymlink($mode, $sourcePath, $targetDir, 'security-bg.svg', 'security-bg.svg');
        
        print_r('Установка завершена' . "\n");

    }
}
