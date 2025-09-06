// CategoryChips component - Filter products by category
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* All Categories */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === null
            ? 'bg-primary-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All
      </button>

      {/* Category Chips */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
