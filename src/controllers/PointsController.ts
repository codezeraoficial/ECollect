import knex from "../database/connection";
import { Response, Request } from "express";

class PointsController {
  async index(req: Request, res: Response) {
    const {city, uf, items} = req.query;

    const parsedItems = String(items)
    .split(',')
    .map(item=> Number(item.trim()));

    const points = await knex('points')
        .join('points_items', 'points.id', '=', 'points_items.point_id')
        .whereIn('points_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');

        return res.json(points);


  }
  async show(req: Request, res: Response) {
    const {id} = req.params;

    const point = await knex('points').where('id', id).first();

    if(!point){
      return res.status(400).json({message: 'Point not found.'});
    }

    const items = await knex('items')
          .join('points_items', 'items.id', '=', 'points_items.item_id')
          .where('points_items.point_id', id);

    return res.json({point, items});
  }

  async create(req: Request, res: Response) {
    const {
      name,
      image,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      street,
      number,
      neighborhood,
      uf,
      items,
    } = req.body;

    const trx = await knex.transaction();

    const point = {
      name,
      image,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      street,
      number,
      neighborhood,
      uf,
    };

    const insertedIds = await trx("points").insert(point);

    const point_id = insertedIds[0];

    const pointsItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      };
    });

    await trx("points_items").insert(pointsItems);

    await trx.commit();

    return res.json({
      id: point_id,
      ...point,
    });
  }
}

export default PointsController;
