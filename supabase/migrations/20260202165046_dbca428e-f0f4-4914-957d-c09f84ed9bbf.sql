-- Add department_id to public_form_links
ALTER TABLE public.public_form_links
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_public_form_links_department ON public.public_form_links(department_id);