-- Assign group_admin role to sudarakap@lyceumglobal.co
INSERT INTO public.user_roles (user_id, role)
VALUES ('ffe08bf1-1cc3-460e-b502-df2d528648fb', 'group_admin')
ON CONFLICT (user_id, role) DO NOTHING;