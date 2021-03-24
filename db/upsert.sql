INSERT INTO post(platform_id, title, link, like_of_reply, unlike_of_reply, total_of_reply, popularity_index, weighted_popularity_index, image_url_list, create_date)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (link)
DO UPDATE
SET
title = $2,
like_of_reply = $4,
unlike_of_reply = $5,
total_of_reply = $6,
image_url_list = $9,
create_date = $10;