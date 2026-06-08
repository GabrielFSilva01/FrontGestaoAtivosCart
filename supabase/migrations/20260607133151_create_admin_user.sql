-- Migration to register an administrative user
-- Timestamp: 2026-06-07T13:31:51 (UTC)

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_perfil_id INT;
BEGIN
    -- 1. Obter o ID do perfil 'Gestor' na tabela public.perfil_acesso
    SELECT id INTO v_perfil_id FROM public.perfil_acesso WHERE nome = 'Gestor' LIMIT 1;
    
    -- Caso o perfil 'Gestor' não exista, insere ele primeiro (geralmente id = 1)
    IF v_perfil_id IS NULL THEN
        INSERT INTO public.perfil_acesso (id, nome, descricao)
        VALUES (1, 'Gestor', 'Administrador (Gestor)')
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome
        RETURNING id INTO v_perfil_id;
    END IF;

    -- 2. Limpar qualquer registro pré-existente com este e-mail para evitar conflitos de chave primária/única
    DELETE FROM public.usuarios WHERE id IN (SELECT id FROM auth.users WHERE email = 'gabrielknightdark@outlook.com');
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'gabrielknightdark@outlook.com');
    DELETE FROM auth.users WHERE email = 'gabrielknightdark@outlook.com';

    -- 3. Inserir o novo usuário administrativo em auth.users
    -- email_confirmed_at e confirmed_at são definidos como o momento atual (now())
    -- Todos os tokens de autenticação/confirmação/recuperação são limpos (setados como NULL)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        phone_change_token,
        reauthentication_token
    )
    VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'gabrielknightdark@outlook.com',
        extensions.crypt('1234Ferreira!', extensions.gen_salt('bf')),
        now(),
        now(),
        null,
        null,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"nome": "Gabriel Knight"}'::jsonb,
        now(),
        now(),
        null, -- Limpa token de confirmação
        null, -- Limpa token de recuperação
        null, -- Limpa token de alteração de e-mail novo
        null, -- Limpa token de alteração de e-mail atual
        null, -- Limpa token de telefone
        null  -- Limpa token de reautenticação
    );

    -- 4. Inserir correspondência na tabela auth.identities para possibilitar o login tradicional por e-mail
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_user_id,
        format('{"sub": "%s", "email": "gabrielknightdark@outlook.com"}', v_user_id::text)::jsonb,
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
    );

    -- 5. Inserir o registro correspondente na tabela public.usuarios vinculando ao perfil 'Gestor'
    INSERT INTO public.usuarios (
        id,
        nome,
        perfil_acesso_id,
        created_at
    )
    VALUES (
        v_user_id,
        'Gabriel Knight',
        v_perfil_id,
        now()
    );

END $$;
