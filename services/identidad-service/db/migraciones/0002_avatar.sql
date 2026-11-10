-- Foto de perfil del comensal, que la ficha pública copia en las reseñas.
alter table usuarios
  add column if not exists avatar_url text;
