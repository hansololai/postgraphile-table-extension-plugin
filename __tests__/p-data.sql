insert into p.forward_user_infos(id, phone) values
(1, 'phone1'),
(2, 'phone2');

insert into p.users(id, content, forward_user_info_id) values
  (1, 'user1',1),
  (2, 'user2',2);

insert into p.user_extra_infos(id,user_id,email) values 
(1,1,'email1'),
(2,2,'email2');


