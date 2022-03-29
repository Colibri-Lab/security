<?php

namespace App\Modules\Security;
use ReflectionClass;

class Installer

{

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

        // копируем конфиг
        print_r('Копируем файл конфигурации' . "\n");
        $configPath = $path . '/src/Security/config-template/module-' . $mode . '.yaml';
        $configTargetPath = $configDir . 'security.yaml';
        if (file_exists($configTargetPath)) {
            print_r('Файл конфигурации найден, пропускаем настройку' . "\n");
            return;
        }
        copy($configPath, $configTargetPath);

        print_r('Копируем файл хранилищ' . "\n");
        $configPath = $path . '/src/Security/config-template/security-storages.yaml';
        $configTargetPath = $configDir . 'security-storages.yaml';
        if (file_exists($configTargetPath)) {
            print_r('Файл конфигурации найден, пропускаем настройку' . "\n");
            return;
        }
        copy($configPath, $configTargetPath);

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
    config: include(/config/security.yaml)', $modulesConfigContent);
        file_put_contents($modulesTargetPath, $modulesConfigContent);

        print_r('Установка скриптов' . "\n");
        $scriptsPath = $path . '/src/Security/bin/';
        $binDir = './bin/';

        copy($scriptsPath . 'security-migrate.sh', $binDir . 'security-migrate.sh');
        copy($scriptsPath . 'security-models-generate.sh', $binDir . 'security-models-generate.sh');

        print_r('Копирование изображений' . "\n");

        $sourcePath = $path . '/src/Security/web/res/img/';
        $targetDir = './web/res/img/';

        copy($sourcePath . 'security-arrow.svg', $targetDir . 'security-arrow.svg');
        copy($sourcePath . 'security-logo-only.svg', $targetDir . 'security-logo-only.svg');
        copy($sourcePath . 'security-icon-cart-white.svg', $targetDir . 'security-icon-cart-white.svg');
        copy($sourcePath . 'security-logo.svg', $targetDir . 'security-logo.svg');
        copy($sourcePath . 'security-bg.svg', $targetDir . 'security-bg.svg');

        print_r('Установка завершена' . "\n");

    }
}
