import { useParams, useNavigate } from 'react-router-dom';
import ProductEditor from '../../components/admin/ProductEditor';
import { useCallback } from 'react';

export default function AdminEditProductPage(){
  const { productSlug } = useParams<{productSlug:string}>();
  const navigate = useNavigate();
  const close = useCallback(()=> navigate('/admin/products'),[navigate]);
  return (
    <div className="relative">
      <ProductEditor productSlug={productSlug||null} isOpen={true} onClose={close} inline />
    </div>
  );
}
