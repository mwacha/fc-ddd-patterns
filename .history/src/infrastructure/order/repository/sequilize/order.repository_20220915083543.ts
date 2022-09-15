import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import ProductModel from "../../../product/repository/sequelize/product.model";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        where: {
          id: entity.id,
        },
      }
    );
  }

  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        include: ["items"],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Order not found");
    }
    const orderItems = orderModel.items.map((item) => {
      let orderItem = new OrderItem(
        item.id,
        item.name,
        item.price,
        item.product_id,
        item.quantity
      );
      return orderItem;
    });

    return new Order(id, orderModel.customer_id, orderItems);
  }

  async findAll(): Promise<Order[]> {
    let orderModels;
    try {
      orderModels = await OrderModel.findAll({ include: ["items"] });
    } catch (error) {
      throw new Error("Order not found");
    }
    
    const retOrders = await Promise.all(orderModels.map(async (orderModel) : Promise<Order>  => {

      let orderItens: OrderItem[] = await Promise.all(orderModel.items.map( async (item): Promise<OrderItem>  => {
        let prd = ( await ProductModel.findOne({ where: { id: item.product_id } }));
      
        return new OrderItem(
          item.id,
          item.name,
          prd.price,
          item.product_id,
          item.quantity
        )}));   

      return new Order(orderModel.id, orderModel.customer_id, orderItens)

    }));
      
    return retOrders;
  }
}

