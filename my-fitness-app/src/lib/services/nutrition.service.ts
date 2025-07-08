// ================================
// src/lib/services/nutrition.service.ts
// ================================
import { BaseService } from './base.service';

export interface NutritionPlan {
  nutrition_plan_id: number;
  program_id?: number;
  user_id?: number;
  title: string;
  description?: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meal_count: number;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  program_title?: string;
  user_first_name?: string;
  user_last_name?: string;
}

export interface Meal {
  meal_id: number;
  nutrition_plan_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  preparation_time: number; // in minutes
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at: Date;
  updated_at: Date;
}

export interface FoodItem {
  food_item_id: number;
  name: string;
  brand?: string;
  serving_size: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving?: number;
  sugar_per_serving?: number;
  sodium_per_serving?: number;
  category: string;
  created_at: Date;
}

export interface CreateNutritionPlanData {
  program_id?: number;
  user_id?: number;
  title: string;
  description?: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meal_count: number;
}

export interface CreateMealData {
  nutrition_plan_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients?: string[];
  preparation_time: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export interface CreateFoodItemData {
  name: string;
  brand?: string;
  serving_size: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving?: number;
  sugar_per_serving?: number;
  sodium_per_serving?: number;
  category: string;
}

export interface NutritionStats {
  total_plans: number;
  avg_target_calories: number;
  most_common_meal_type: string;
  total_meals: number;
  avg_preparation_time: number;
}

export class NutritionService extends BaseService {
  // Nutrition Plans
  async getAll(): Promise<NutritionPlan[]> {
    const query = `
      SELECT 
        np.*,
        p.title as program_title,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM nutrition_plans np
      LEFT JOIN programs p ON np.program_id = p.program_id
      LEFT JOIN users u ON np.user_id = u.user_id
      ORDER BY np.created_at DESC
    `;
    return this.query<NutritionPlan>(query);
  }

  async findById(nutritionPlanId: number): Promise<NutritionPlan | null> {
    const query = `
      SELECT 
        np.*,
        p.title as program_title,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM nutrition_plans np
      LEFT JOIN programs p ON np.program_id = p.program_id
      LEFT JOIN users u ON np.user_id = u.user_id
      WHERE np.nutrition_plan_id = $1
    `;
    return this.queryOne<NutritionPlan>(query, [nutritionPlanId]);
  }

  async getByProgramId(programId: number): Promise<NutritionPlan[]> {
    const query = `
      SELECT 
        np.*,
        p.title as program_title
      FROM nutrition_plans np
      LEFT JOIN programs p ON np.program_id = p.program_id
      WHERE np.program_id = $1
      ORDER BY np.created_at DESC
    `;
    return this.query<NutritionPlan>(query, [programId]);
  }

  async getByUserId(userId: number): Promise<NutritionPlan[]> {
    const query = `
      SELECT 
        np.*,
        p.title as program_title
      FROM nutrition_plans np
      LEFT JOIN programs p ON np.program_id = p.program_id
      WHERE np.user_id = $1
      ORDER BY np.created_at DESC
    `;
    return this.query<NutritionPlan>(query, [userId]);
  }

  async create(planData: CreateNutritionPlanData): Promise<NutritionPlan> {
    const query = `
      INSERT INTO nutrition_plans (
        program_id, user_id, title, description, target_calories, 
        target_protein, target_carbs, target_fat, meal_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      planData.program_id || null,
      planData.user_id || null,
      planData.title,
      planData.description || null,
      planData.target_calories,
      planData.target_protein,
      planData.target_carbs,
      planData.target_fat,
      planData.meal_count
    ];

    const result = await this.queryOne<NutritionPlan>(query, params);
    if (!result) throw new Error('Failed to create nutrition plan');
    return result;
  }

  async update(nutritionPlanId: number, updateData: Partial<CreateNutritionPlanData>): Promise<NutritionPlan> {
    const { query, params } = this.buildUpdateQuery('nutrition_plans', updateData, 'nutrition_plan_id', nutritionPlanId);
    const result = await this.queryOne<NutritionPlan>(query, params);
    if (!result) throw new Error('Nutrition plan not found');
    return result;
  }

  async delete(nutritionPlanId: number): Promise<void> {
    // Delete associated meals first
    await this.query('DELETE FROM meals WHERE nutrition_plan_id = $1', [nutritionPlanId]);
    // Delete the nutrition plan
    await this.query('DELETE FROM nutrition_plans WHERE nutrition_plan_id = $1', [nutritionPlanId]);
  }

  // Meals
  async getMealsByPlanId(nutritionPlanId: number): Promise<Meal[]> {
    const query = `
      SELECT * FROM meals 
      WHERE nutrition_plan_id = $1 
      ORDER BY 
        CASE meal_type 
          WHEN 'breakfast' THEN 1 
          WHEN 'lunch' THEN 2 
          WHEN 'snack' THEN 3 
          WHEN 'dinner' THEN 4 
        END,
        created_at ASC
    `;
    return this.query<Meal>(query, [nutritionPlanId]);
  }

  async createMeal(mealData: CreateMealData): Promise<Meal> {
    const query = `
      INSERT INTO meals (
        nutrition_plan_id, meal_type, name, description, calories, 
        protein, carbs, fat, ingredients, preparation_time, difficulty_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      mealData.nutrition_plan_id,
      mealData.meal_type,
      mealData.name,
      mealData.description || null,
      mealData.calories,
      mealData.protein,
      mealData.carbs,
      mealData.fat,
      JSON.stringify(mealData.ingredients || []),
      mealData.preparation_time,
      mealData.difficulty_level
    ];

    const result = await this.queryOne<Meal>(query, params);
    if (!result) throw new Error('Failed to create meal');
    return result;
  }

  async updateMeal(mealId: number, updateData: Partial<CreateMealData>): Promise<Meal> {
    // Convert ingredients to JSON if provided
    if (updateData.ingredients) {
      (updateData as any).ingredients = JSON.stringify(updateData.ingredients);
    }

    const { query, params } = this.buildUpdateQuery('meals', updateData, 'meal_id', mealId);
    const result = await this.queryOne<Meal>(query, params);
    if (!result) throw new Error('Meal not found');
    return result;
  }

  async deleteMeal(mealId: number): Promise<void> {
    const query = 'DELETE FROM meals WHERE meal_id = $1';
    await this.query(query, [mealId]);
  }

  // Food Items
  async getFoodItems(category?: string): Promise<FoodItem[]> {
    let query = 'SELECT * FROM food_items';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY name ASC';
    return this.query<FoodItem>(query, params);
  }

  async createFoodItem(foodData: CreateFoodItemData): Promise<FoodItem> {
    const query = `
      INSERT INTO food_items (
        name, brand, serving_size, calories_per_serving, protein_per_serving, 
        carbs_per_serving, fat_per_serving, fiber_per_serving, 
        sugar_per_serving, sodium_per_serving, category
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      foodData.name,
      foodData.brand || null,
      foodData.serving_size,
      foodData.calories_per_serving,
      foodData.protein_per_serving,
      foodData.carbs_per_serving,
      foodData.fat_per_serving,
      foodData.fiber_per_serving || null,
      foodData.sugar_per_serving || null,
      foodData.sodium_per_serving || null,
      foodData.category
    ];

    const result = await this.queryOne<FoodItem>(query, params);
    if (!result) throw new Error('Failed to create food item');
    return result;
  }

  // Statistics
  async getNutritionStats(): Promise<NutritionStats> {
    const plansStatsQuery = `
      SELECT 
        COUNT(*) as total_plans,
        COALESCE(AVG(target_calories), 0) as avg_target_calories
      FROM nutrition_plans
    `;

    const mealsStatsQuery = `
      SELECT 
        COUNT(*) as total_meals,
        COALESCE(AVG(preparation_time), 0) as avg_preparation_time,
        MODE() WITHIN GROUP (ORDER BY meal_type) as most_common_meal_type
      FROM meals
    `;

    const [plansResult, mealsResult] = await Promise.all([
      this.queryOne<{
        total_plans: string;
        avg_target_calories: string;
      }>(plansStatsQuery),
      this.queryOne<{
        total_meals: string;
        avg_preparation_time: string;
        most_common_meal_type: string;
      }>(mealsStatsQuery)
    ]);

    return {
      total_plans: parseInt(plansResult?.total_plans || '0'),
      avg_target_calories: parseFloat(plansResult?.avg_target_calories || '0'),
      total_meals: parseInt(mealsResult?.total_meals || '0'),
      avg_preparation_time: parseFloat(mealsResult?.avg_preparation_time || '0'),
      most_common_meal_type: mealsResult?.most_common_meal_type || 'N/A'
    };
  }

  async calculatePlanTotals(nutritionPlanId: number): Promise<{
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    meal_breakdown: Record<string, any>;
  }> {
    const query = `
      SELECT 
        meal_type,
        SUM(calories) as calories,
        SUM(protein) as protein,
        SUM(carbs) as carbs,
        SUM(fat) as fat,
        COUNT(*) as meal_count
      FROM meals 
      WHERE nutrition_plan_id = $1
      GROUP BY meal_type
    `;

    const results = await this.query<{
      meal_type: string;
      calories: string;
      protein: string;
      carbs: string;
      fat: string;
      meal_count: string;
    }>(query, [nutritionPlanId]);

    let total_calories = 0;
    let total_protein = 0;
    let total_carbs = 0;
    let total_fat = 0;
    const meal_breakdown: Record<string, any> = {};

    results.forEach(row => {
      const calories = parseFloat(row.calories);
      const protein = parseFloat(row.protein);
      const carbs = parseFloat(row.carbs);
      const fat = parseFloat(row.fat);

      total_calories += calories;
      total_protein += protein;
      total_carbs += carbs;
      total_fat += fat;

      meal_breakdown[row.meal_type] = {
        calories,
        protein,
        carbs,
        fat,
        meal_count: parseInt(row.meal_count)
      };
    });

    return {
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      meal_breakdown
    };
  }
}