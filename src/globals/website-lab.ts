import type { GlobalConfig } from "payload/types";

const WebsiteLab: GlobalConfig = {
	label: "AI 연구소",
	slug: "website-lab",
	admin: {
		group: "Website",
	},
	fields: [
		{
			type: "collapsible",
			label: "메인 페이지",
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
	],
};

export default WebsiteLab;
