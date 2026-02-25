
/**
 * Функция для расчета выручки
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount = 0 } = purchase;
    return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    if (index === 0) return profit * 0.15;
    if (index === 1 || index === 2) return profit * 0.10;
    if (index === total - 1) return 0;
    return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
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
        throw new Error('В опциях отсутствуют требуемые функции');
    }

    // Подготовка данных
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
    sellerStats.forEach(stat => sellerIndex[stat.id] = stat);

    const productIndex = {};
    data.products.forEach(product => productIndex[product.sku] = product);

    // Расчет
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        if (Array.isArray(record.items)) {
            record.items.forEach(item => {
                const product = productIndex[item.sku];
                if (!product) return;

                const revenue = calculateRevenue(item, product);
                const cost = product.purchase_price * item.quantity;

                seller.profit += (revenue - cost);
                seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
            });
        }
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Бонусы и топ-10 (только по количеству!)
    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);

        // Топ-10 товаров: сортировка ТОЛЬКО по количеству (по убыванию)
        const products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)  // ⬅️ ТОЛЬКО ЭТО
            .slice(0, 10);

        seller.top_products = products;
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
}/**
 * Функция для расчета выручки
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount = 0 } = purchase;
    return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    if (index === 0) return profit * 0.15;
    if (index === 1 || index === 2) return profit * 0.10;
    if (index === total - 1) return 0;
    return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
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
        throw new Error('В опциях отсутствуют требуемые функции');
    }

    // Подготовка данных
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
    sellerStats.forEach(stat => sellerIndex[stat.id] = stat);

    const productIndex = {};
    data.products.forEach(product => productIndex[product.sku] = product);

    // Расчет
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        if (Array.isArray(record.items)) {
            record.items.forEach(item => {
                const product = productIndex[item.sku];
                if (!product) return;

                const revenue = calculateRevenue(item, product);
                const cost = product.purchase_price * item.quantity;

                seller.profit += (revenue - cost);
                seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
            });
        }
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Бонусы и топ-10 (только по количеству!)
    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);

        // Топ-10 товаров: сортировка ТОЛЬКО по количеству (по убыванию)
        const products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)  // ⬅️ ТОЛЬКО ЭТО
            .slice(0, 10);

        seller.top_products = products;
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
