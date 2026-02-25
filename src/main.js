/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount = 0 } = purchase;
    return Number(sale_price) * Number(quantity) * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    if (!data ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.purchase_records) ||
        data.products.length === 0 ||
        data.sellers.length === 0 ||
        data.purchase_records.length === 0) {
        throw new Error('Неправильные входные данные');
    }


    if (typeof options !== 'object' || options === null) {
        throw new Error('Опции должны быть объектом');
    }
    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('В опциях отсутствуют требуемые функции calculateRevenue и/или calculateBonus');
    }


    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Unknown',
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));


    const sellerIndex = {};
    sellerStats.forEach(stat => {
        sellerIndex[stat.id] = stat;
    });

    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });


    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        
        seller.sales_count += 1;
        

        seller.revenue += Number(record.total_amount); 

        if (Array.isArray(record.items)) {
            record.items.forEach(item => {
                const product = productIndex[item.sku];
                if (!product) return;
                

                const revenue = calculateRevenue(item, product);
                const cost = Number(product.purchase_price) * Number(item.quantity);
                
                seller.profit += (revenue - cost);

                const sku = item.sku;
                if (!seller.products_sold[sku]) {
                    seller.products_sold[sku] = 0;
                }
                seller.products_sold[sku] += Number(item.quantity);
            });
        }
    });


    sellerStats.sort((a, b) => b.profit - a.profit);


    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);

        const productList = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku,
                quantity
            }))
            .sort((a, b) => {
                if (a.quantity !== b.quantity) {
                    return b.quantity - a.quantity;
                } else {
                    return a.sku.localeCompare(b.sku);
                }
            })
            .slice(0, 10);
        
        seller.top_products = productList;
    });


    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}


if (typeof window !== 'undefined') {
    window.calculateSimpleRevenue = calculateSimpleRevenue;
    window.calculateBonusByProfit = calculateBonusByProfit;
    window.analyzeSalesData = analyzeSalesData;
}