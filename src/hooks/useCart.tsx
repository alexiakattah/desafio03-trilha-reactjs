import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const getProduct = [...cart];

      const productExists = getProduct.find(
        (product) => product.id === productId
      );
      const currentProductAmount = productExists ? productExists.amount : 0;

      const responseStockProduct = await api.get(`/stock/${productId}`);
      const stockProductAmount = responseStockProduct.data.amount;

      const amount = currentProductAmount + 1;

      if (amount > stockProductAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const responseProduct = await api.get(`/products/${productId}`);
        const newProduct = { ...responseProduct.data, amount: 1 };
        getProduct.push(newProduct);
      }

      setCart(getProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(getProduct));
    } catch (e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const getProducts = [...cart];
      const findIndexProduct = getProducts.findIndex(
        (product) => product.id === productId
      );

      if (findIndexProduct > 0) {
        getProducts.splice(findIndexProduct, 1);
        setCart(getProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(getProducts));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const responseStockProduct = await api.get(`/stock/${productId}`);
      const stockProductAmount = responseStockProduct.data.amount;

      if (amount > stockProductAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const getProducts = [...cart];

      const productExists = getProducts.find(
        (product) => product.id === productId
      );

      if (productExists) {
        productExists.amount = amount;
        setCart(getProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(getProducts));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
