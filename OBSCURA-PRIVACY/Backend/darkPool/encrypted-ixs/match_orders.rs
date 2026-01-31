use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    const MAX_ORDERS: usize = 100;

    #[derive(Copy, Clone)]
    pub struct Order {
        pub price: u64,
        pub amount: u64,
        pub side: u8, // 0 = buy, 1 = sell
        pub order_type: u8, // 0 = market, 1 = limit
        pub user_id: u128,
        pub active: u8, // 0 = inactive, 1 = active
    }

    #[derive(Copy, Clone)]
    pub struct OrderBook {
        pub orders: [Order; MAX_ORDERS],
        pub order_count: u64,
    }

    #[derive(Copy, Clone)]
    pub struct MatchResult {
        pub matched: u8,
        pub match_price: u64,
        pub match_amount: u64,
        pub buy_order_id: u64,
        pub sell_order_id: u64,
    }

    // Add order to encrypted order book
    #[instruction]
    pub fn add_order(
        order_ctxt: Enc<Shared, Order>,
        orderbook_ctxt: Enc<Mxe, OrderBook>,
    ) -> Enc<Mxe, OrderBook> {
        let order = order_ctxt.to_arcis();
        let mut ob = orderbook_ctxt.to_arcis();

        // Find empty slot and add order
        let mut added = 0u8;
        for i in 0..MAX_ORDERS {
            let is_empty = ob.orders[i].active == 0;
            let should_add = is_empty && added == 0;
            
            if should_add {
                ob.orders[i] = order;
                ob.orders[i].active = 1;
                added = 1;
            }
        }

        // Increment order count if added
        let count_increment = if added == 1 { 1u64 } else { 0u64 };
        ob.order_count = ob.order_count + count_increment;

        orderbook_ctxt.owner.from_arcis(ob)
    }

    // Match orders in encrypted order book
    #[instruction]
    pub fn match_orders(
        orderbook_ctxt: Enc<Mxe, OrderBook>,
    ) -> (Enc<Mxe, OrderBook>, Enc<Shared, MatchResult>) {
        let mut ob = orderbook_ctxt.to_arcis();
        
        let mut result = MatchResult {
            matched: 0,
            match_price: 0,
            match_amount: 0,
            buy_order_id: 0,
            sell_order_id: 0,
        };

        // Find matching buy and sell orders
        for i in 0..MAX_ORDERS {
            for j in 0..MAX_ORDERS {
                let buy_order = ob.orders[i];
                let sell_order = ob.orders[j];

                // Check if orders can match
                let is_buy = buy_order.side == 0;
                let is_sell = sell_order.side == 1;
                let both_active = buy_order.active == 1 && sell_order.active == 1;
                let not_same_user = buy_order.user_id != sell_order.user_id;
                
                // Price matching logic
                let price_match = if buy_order.order_type == 0 || sell_order.order_type == 0 {
                    // Market order - always matches
                    1u8
                } else {
                    // Limit order - buy price >= sell price
                    if buy_order.price >= sell_order.price { 1u8 } else { 0u8 }
                };

                let can_match = is_buy && is_sell && both_active && not_same_user && price_match == 1 && result.matched == 0;

                if can_match {
                    // Calculate match price (midpoint for limit orders, limit price for market)
                    let match_price = if buy_order.order_type == 0 {
                        sell_order.price
                    } else if sell_order.order_type == 0 {
                        buy_order.price
                    } else {
                        (buy_order.price + sell_order.price) / 2
                    };

                    // Calculate match amount (minimum of both orders)
                    let match_amount = if buy_order.amount < sell_order.amount {
                        buy_order.amount
                    } else {
                        sell_order.amount
                    };

                    // Update result
                    result.matched = 1;
                    result.match_price = match_price;
                    result.match_amount = match_amount;
                    result.buy_order_id = i as u64;
                    result.sell_order_id = j as u64;

                    // Update order amounts
                    ob.orders[i].amount = ob.orders[i].amount - match_amount;
                    ob.orders[j].amount = ob.orders[j].amount - match_amount;

                    // Deactivate fully filled orders
                    if ob.orders[i].amount == 0 {
                        ob.orders[i].active = 0;
                    }
                    if ob.orders[j].amount == 0 {
                        ob.orders[j].active = 0;
                    }
                }
            }
        }

        let updated_ob = orderbook_ctxt.owner.from_arcis(ob);
        let match_result = orderbook_ctxt.owner.from_arcis(result);

        (updated_ob, match_result)
    }

    // Cancel order from encrypted order book
    #[instruction]
    pub fn cancel_order(
        order_id: u64,
        user_id: Enc<Shared, u128>,
        orderbook_ctxt: Enc<Mxe, OrderBook>,
    ) -> Enc<Mxe, OrderBook> {
        let user = user_id.to_arcis();
        let mut ob = orderbook_ctxt.to_arcis();

        // Find and cancel order if user matches
        for i in 0..MAX_ORDERS {
            let is_target_order = (i as u64) == order_id;
            let is_owner = ob.orders[i].user_id == user;
            let is_active = ob.orders[i].active == 1;
            
            let should_cancel = is_target_order && is_owner && is_active;

            if should_cancel {
                ob.orders[i].active = 0;
                ob.order_count = ob.order_count - 1;
            }
        }

        orderbook_ctxt.owner.from_arcis(ob)
    }

    // Get order book depth (privacy-preserving aggregation)
    #[instruction]
    pub fn get_orderbook_depth(
        orderbook_ctxt: Enc<Mxe, OrderBook>,
        price_levels: u64,
    ) -> Enc<Shared, [u64; 20]> {
        let ob = orderbook_ctxt.to_arcis();
        let mut depth: [u64; 20] = [0; 20];

        // Aggregate buy orders by price level (simplified)
        for i in 0..10 {
            let mut level_volume = 0u64;
            for j in 0..MAX_ORDERS {
                let order = ob.orders[j];
                let is_buy = order.side == 0;
                let is_active = order.active == 1;
                
                if is_buy && is_active {
                    level_volume = level_volume + order.amount;
                }
            }
            depth[i] = level_volume;
        }

        // Aggregate sell orders by price level
        for i in 10..20 {
            let mut level_volume = 0u64;
            for j in 0..MAX_ORDERS {
                let order = ob.orders[j];
                let is_sell = order.side == 1;
                let is_active = order.active == 1;
                
                if is_sell && is_active {
                    level_volume = level_volume + order.amount;
                }
            }
            depth[i] = level_volume;
        }

        orderbook_ctxt.owner.from_arcis(depth)
    }
}
