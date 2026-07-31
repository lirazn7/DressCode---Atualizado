import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../database/firebase';

export async function getUserClosetItems(userId) {
  if (!userId) return { items: [], summary: '' };

  try {
    const [catalogsSnap, categoriesSnap, itemsSnap] = await Promise.all([
      getDocs(query(collection(db, 'catalogs'), where('userid', '==', userId))),
      getDocs(query(collection(db, 'piece_categories'), where('userid', '==', userId))),
      getDocs(query(collection(db, 'catalog_items'), where('userid', '==', userId))),
    ]);

    const catalogsMap = {};
    catalogsSnap.forEach((d) => {
      catalogsMap[d.id] = d.data();
    });

    const categoriesMap = {};
    categoriesSnap.forEach((d) => {
      categoriesMap[d.id] = d.data();
    });

    const items = [];
    itemsSnap.forEach((d) => {
      const data = d.data();
      let categoryLabel = 'Sem categoria';

      if (data.catalogid && catalogsMap[data.catalogid]) {
        const cat = catalogsMap[data.catalogid];
        categoryLabel = `${cat.emoji || ''} ${cat.nome}`.trim();
      } else if (data.piece_category_id && categoriesMap[data.piece_category_id]) {
        const cat = categoriesMap[data.piece_category_id];
        categoryLabel = `${cat.emoji || ''} ${cat.nome}`.trim();
      }

      items.push({
        id: d.id,
        name: data.legenda || 'Peça sem nome',
        category: categoryLabel,
      });
    });

    const summary = items.length === 0
      ? 'O closet está vazio.'
      : items.map((item, i) => `${i + 1}. ${item.name} (${item.category})`).join('\n');

    return { items, summary };
  } catch (error) {
    console.error('Erro ao buscar closet:', error);
    return { items: [], summary: '' };
  }
}
