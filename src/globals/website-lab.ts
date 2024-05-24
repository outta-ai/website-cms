import type { GlobalConfig } from "payload/types";

const WebsiteLab: GlobalConfig = {
	label: "웹사이트",
	slug: "website-lab",
	admin: {
		group: "AI 연구소",
	},
	access: {
		read: () => true,
	},
	fields: [
		{
			type: "collapsible",
			label: "메인 페이지",
			admin: {
				initCollapsed: true,
			},
			fields: [
				{
					type: "group",
					name: "index",
					label: "메인 페이지",
					fields: [
						{
							type: "array",
							name: "characteristics",
							label: "특징",
							labels: {
								singular: "Characteristic",
								plural: "Characteristics",
							},
							fields: [
								{
									type: "text",
									name: "title",
									label: "제목",
									required: true,
								},
								{
									type: "richText",
									name: "description",
									label: "설명",
									required: true,
								},
							],
						},
						{
							type: "array",
							name: "curriculums",
							label: "커리큘럼",
							labels: {
								singular: "Curriculum",
								plural: "Curriculums",
							},
							fields: [
								{
									type: "upload",
									name: "icon",
									label: "아이콘",
									required: true,
									relationTo: "media",
								},
								{
									type: "text",
									name: "name",
									label: "제목",
									required: true,
								},
								{
									type: "textarea",
									name: "description",
									label: "설명",
									required: true,
								},
								{
									type: "array",
									name: "courses",
									label: "학습과정",
									labels: {
										singular: "Course",
										plural: "Courses",
									},
									fields: [
										{
											type: "text",
											name: "name",
											label: "제목",
											required: true,
										},
										{
											type: "textarea",
											name: "description",
											label: "설명",
											required: true,
										},
									],
								},
							],
						},
						{
							type: "array",
							name: "reviews",
							label: "수강 후기",
							labels: {
								singular: "Review",
								plural: "Reviews",
							},
							fields: [
								{
									type: "text",
									name: "name",
									label: "이름",
									required: true,
								},
								{
									type: "richText",
									name: "description",
									label: "내용",
									required: true,
								},
							],
						},
						{
							type: "array",
							name: "recommend",
							label: "이런 분들께 추천해요",
							labels: {
								singular: "Recommend",
								plural: "Recommends",
							},
							fields: [
								{
									type: "upload",
									name: "image",
									label: "이미지",
									relationTo: "media",
								},
								{
									type: "richText",
									name: "description",
									label: "설명",
									required: true,
								},
							],
						},
						{
							type: "group",
							name: "registration",
							label: "참가 신청",
							fields: [
								{
									type: "date",
									name: "due_date",
									label: "접수 마감일",
									required: true,
									admin: {
										date: {
											pickerAppearance: "dayAndTime",
										},
									},
								},
								{
									type: "text",
									name: "link",
									label: "참가 신청 링크",
									required: true,
									validate: (value) => {
										if (
											/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(
												value,
											)
										) {
											return true;
										}

										return "올바른 주소가 아닙니다";
									},
								},
							],
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "교육자료",
			admin: {
				initCollapsed: true,
			},
			required: true,
			fields: [
				{
					type: "array",
					name: "materials",
					label: "교육자료",
					fields: [
						{
							type: "text",
							name: "title",
							label: "제목",
							required: true,
						},
						{
							type: "richText",
							name: "description",
							label: "설명",
							required: true,
						},
						{
							type: "number",
							name: "year",
							label: "출판 년도",
							required: true,
						},
						{
							type: "text",
							name: "publisher",
							label: "출판사",
							required: true,
						},
						{
							type: "number",
							name: "price",
							label: "정가",
							required: true,
						},
						{
							type: "text",
							name: "link",
							label: "구매링크",
						},
						{
							type: "upload",
							name: "image",
							label: "사진",
							required: true,
							relationTo: "media",
						},
					],
				},
			],
		},
		{
			type: "collapsible",
			label: "멤버",
			admin: {
				initCollapsed: true,
			},
			required: true,
			fields: [
				{
					type: "group",
					name: "members",
					label: "멤버",
					fields: [
						{
							type: "array",
							name: "generations",
							label: "기수",
							fields: [
								{
									type: "number",
									name: "index",
									label: "기수",
									required: true,
								},
								{
									type: "date",
									name: "start",
									label: "시작",
									admin: {
										date: {
											pickerAppearance: "monthOnly",
											displayFormat: "yyyy년 MM월",
										},
									},
									required: true,
								},
								{
									type: "date",
									name: "end",
									label: "종료",
									admin: {
										date: {
											pickerAppearance: "monthOnly",
											displayFormat: "yyyy년 MM월",
										},
									},
								},
							],
						},
						{
							type: "array",
							name: "members",
							label: "멤버",
							fields: [
								{
									type: "text",
									name: "role",
									label: "직책",
									required: true,
								},
								{
									type: "number",
									name: "generation",
									label: "기수",
									required: true,
								},
								{
									type: "relationship",
									name: "member",
									label: "멤버",
									relationTo: "members",
								},
								{
									type: "array",
									name: "works",
									label: "직무",
									fields: [
										{
											type: "text",
											name: "description",
											label: "직무",
											required: true,
										},
									],
								},
							],
						},
					],
				},
			],
		},
	],
};

export default WebsiteLab;
