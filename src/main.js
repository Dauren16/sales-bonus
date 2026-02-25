/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount = 0 } = purchase;
    return sale_price * quantity * (1 - discount / 100);
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
    // Проверка входных данных
    if (!data ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.purchase_records) ||
        data.products.length === 0 ||
        data.sellers.length === 0 ||
        data.purchase_records.length === 0) {
        throw new Error('Неправильные входные данные');
    }

    // Проверка наличия опций
    if (typeof options !== 'object' || options === null) {
        throw new Error('Опции должны быть объектом');
    }
    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('В опциях отсутствуют требуемые функции calculateRevenue и/или calculateBonus');
    }

    // Подготовка промежуточных данных
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || 'Unknown',
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // Индексация
    const sellerIndex = {};
    sellerStats.forEach(stat => {
        sellerIndex[stat.id] = stat;
    });

    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // Расчет выручки и прибыли
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        
        seller.sales_count += 1;
        
        seller.revenue += record.total_amount - record.total_discount; 

        if (Array.isArray(record.items)) {
            record.items.forEach(item => {
                const product = productIndex[item.sku];
                if (!product) return;
                
                // Для прибыли используем calculateRevenue
                const revenue = calculateRevenue(item, product);
                const cost = product.purchase_price * item.quantity;
                
                seller.profit += (revenue - cost);

                const sku = item.sku;
                if (!seller.products_sold[sku]) {
                    seller.products_sold[sku] = 0;
                }
                seller.products_sold[sku] += item.quantity;
            });
        }
    });

    // Сортировка
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Назначение бонусов и топ-10
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
                }
                return a.sku.localeCompare(b.sku);
            })
            .slice(0, 10);
        seller.top_products = productList;
    });

    // Возврат результата
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

// Код для браузера
if (typeof window !== 'undefined') {
    window.calculateSimpleRevenue = calculateSimpleRevenue;
    window.calculateBonusByProfit = calculateBonusByProfit;
    window.analyzeSalesData = analyzeSalesData;
}