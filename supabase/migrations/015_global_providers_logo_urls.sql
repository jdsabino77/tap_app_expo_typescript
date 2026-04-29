begin;

update public.providers
set logo_url = 'https://images.squarespace-cdn.com/content/v1/6824e18951ca2d616b8ed7c0/60c5913c-3acf-4003-9d9b-a807ced2346b/YASA-Logo_White_PNG.png'
where id = '2f46976f-e14f-4071-a372-9d46378b7d00';

update public.providers
set logo_url = 'https://yazdaniaesthetics.com/wp-content/themes/yazdani/images/apple-touch-icon.png'
where id = '68e8c3ca-b2d5-4cf9-a3a1-ab40c925c283';

commit;
