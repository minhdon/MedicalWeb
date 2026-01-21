import React, { useEffect } from 'react';
import './ClickEffect.css';

const ClickEffect: React.FC = () => {
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			// Tạo phần tử hiệu ứng
			const effect = document.createElement('div');
			effect.className = 'click-effect';
			
			// Đặt vị trí tại điểm click
			const x = e.clientX;
			const y = e.clientY;
			effect.style.left = `${x}px`;
			effect.style.top = `${y}px`;
			
			// Thêm vào body
			document.body.appendChild(effect);
			
			// Xóa sau khi animation kết thúc
			setTimeout(() => {
				effect.remove();
			}, 600);
		};

		// Thêm event listener
		document.addEventListener('click', handleClick);

		// Cleanup
		return () => {
			document.removeEventListener('click', handleClick);
		};
	}, []);

	return null;
};

export default ClickEffect;




