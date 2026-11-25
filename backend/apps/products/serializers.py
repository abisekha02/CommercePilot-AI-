from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'product_count']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image_url', 'alt_text', 'is_primary', 'display_order']
        extra_kwargs = {'product': {'required': False}}


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'name', 'sku', 'additional_price', 'final_price', 'stock_quantity', 'attributes', 'is_active']
        extra_kwargs = {'product': {'required': False}}


class ProductReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'username', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'username']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    primary_image = serializers.CharField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    total_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'brand',
            'category', 'category_name', 'category_slug',
            'base_price', 'cost_price', 'primary_image',
            'average_rating', 'review_count', 'total_stock',
            'featured', 'is_active', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    total_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'barcode', 'brand',
            'category', 'category_id', 'base_price', 'cost_price',
            'description', 'ai_description', 'is_active', 'featured',
            'tags', 'variants', 'images', 'reviews', 'primary_image',
            'average_rating', 'review_count', 'total_stock',
            'created_at', 'updated_at'
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)
    images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'barcode', 'brand',
            'category', 'base_price', 'cost_price', 'description',
            'ai_description', 'is_active', 'featured', 'tags',
            'variants', 'images'
        ]
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        images_data = validated_data.pop('images', [])
        product = Product.objects.create(**validated_data)

        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)

        for img_data in images_data:
            ProductImage.objects.create(product=product, **img_data)

        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        images_data = validated_data.pop('images', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            # Add or update variants
            for variant_data in variants_data:
                variant_id = variant_data.get('id')
                if variant_id:
                    ProductVariant.objects.filter(id=variant_id, product=instance).update(**variant_data)
                else:
                    ProductVariant.objects.create(product=instance, **variant_data)

        if images_data is not None:
            for img_data in images_data:
                img_id = img_data.get('id')
                if img_id:
                    ProductImage.objects.filter(id=img_id, product=instance).update(**img_data)
                else:
                    ProductImage.objects.create(product=instance, **img_data)

        return instance
