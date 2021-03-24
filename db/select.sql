SELECT id, title, weighted_popularity_index AS "wpi" , image_url_list[1] AS "coverImage", create_date AS "createDate" FROM post 
WHERE available IS NULL OR available != false
ORDER BY weighted_popularity_index DESC, create_date DESC
OFFSET 0 ROWS
FETCH FIRST 20 ROWS ONLY;

SELECT id, title, weighted_popularity_index AS "wpi" , image_url_list[1] AS "coverImage", available, create_date AS "createDate" FROM post 
WHERE available IS NULL OR available != false
ORDER BY weighted_popularity_index DESC, create_date DESC
OFFSET 0 ROWS
FETCH FIRST 20 ROWS ONLY;

SELECT title, link FROM post WHERE platform_id = 1 AND available IS NULL OR available != false;

SELECT title, link, image_url_list AS "imageUrlList", create_date AS "createDate" FROM post WHERE id = 1;