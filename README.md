# Amparo - Frontend 📱

Este é o repositório do frontend do aplicativo móvel Amparo. 

## Sumário

* [Sobre o Projeto](#sobre-o-projeto)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Pré-requisitos](#pré-requisitos)
* [Instalação](#instalação)
* [Como Rodar o Projeto](#como-rodar-o-projeto)

## Sobre o Projeto

O frontend do Amparo é responsável pela interface do usuário e experiência de interação no aplicativo móvel (Android e iOS). Ele se comunica com o backend (quando aplicável para futuras integrações) para buscar e enviar dados, mas é projetado para funcionar de forma eficaz e auto-contida para as funcionalidades principais de gerenciamento de medicamentos.

## Tecnologias Utilizadas

As principais tecnologias, frameworks e bibliotecas usadas neste projeto incluem:

* **React Native:** Framework para desenvolvimento de aplicativos móveis nativos com JavaScript e React.
* **Expo SDK:** Plataforma e conjunto de ferramentas sobre o React Native para simplificar o desenvolvimento, build e deploy.
* **TypeScript:** Superset do JavaScript que adiciona tipagem estática ao código.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* **Node.js:** Versão 20.x ou superior (LTS recomendada).
* **npm** (que já vem com o Node.js).
* **Git:** Para controle de versão.
* **(Opcional) Android Studio / Xcode:** Necessário se você pretende rodar em emuladores/simuladores nativos ou fazer builds de desenvolvimento que incluam código nativo customizado. Para desenvolvimento com Expo Go, geralmente não são estritamente necessários no início.

## Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/luisjro16/amparo-front-end.git
    ```

2.  **Navegue até o diretório do projeto:**
    ```bash
    cd amparo-front-end
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

## Como Rodar o Projeto

Após a instalação das dependências, você pode iniciar o projeto:

1.  **Inicie o servidor de desenvolvimento Metro Bundler:**
    ```bash
    npx expo start
    ```

2.  **Execute o aplicativo:**
    Após o Metro Bundler iniciar, um QR Code será exibido no terminal e uma página web será aberta no navegador com opções. Você pode:

    * **No aplicativo Expo Go (Recomendado para desenvolvimento rápido):**
        * Baixe o aplicativo Expo Go na [App Store (iOS)](https://apps.apple.com/us/app/expo-go/id982107779) ou [Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent).
        * Escaneie o QR Code exibido no terminal ou na página do navegador com o app Expo Go.

    * **Em um Emulador Android:**
        * Certifique-se de ter um emulador Android configurado (via Android Studio) e em execução.
        * No terminal onde o Metro Bundler está rodando, pressione a tecla `a`.

    * **Em um Simulador iOS (Apenas macOS):**
        * Certifique-se de ter o Xcode e um simulador iOS configurado e em execução.
        * No terminal onde o Metro Bundler está rodando, pressione a tecla `i`.
